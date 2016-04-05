
### TEXT PRINTING (letter by letter etc.) ###

class TextPrinter
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  @fullText: ""
  @currentOffset: 0
  @defaultInterval: 0
  @soundBuffer: []
  @musicBuffer: []
  @stopMusicBuffer: []
  @executeBuffer: []
  @buffersExecuted: false
  @scrollSound: null
  @tickSoundFrequency: 1
  @tickCounter: 0
  @tickSpeedMultiplier: 1
  @speedMod: false
  @pause: 0
  @interval: 0
  @printCompleted: false

  # Print a scene's text - noBuffers prevents buffers from replaying when scene is not changed
  @printText: (text, noBuffers) ->
    @printCompleted = false
    novelData.printedText = ""
    # Disable the skip button
    if document.querySelector("#skip-button") isnt null
      document.querySelector("#skip-button").disabled = false;
    @fullText = text
    #console.log fullText
    @currentOffset = -1
    @soundBuffer = []
    @musicBuffer = []
    @stopMusicBuffer = []
    @executeBuffer = []
    @buffersExecuted = false
    if noBuffers
      @buffersExecuted = true
    @defaultInterval = novelData.novel.currentScene.scrollSpeed
    @setTickSoundFrequency(@defaultInterval)
    if novelData.novel.currentScene.visited and novelData.novel.currentScene.revisitSkipEnabled
      @complete()
      return
    setTimeout(@onTick(),@defaultInterval)

  # Try to skip text, if allowed
  @trySkip: ->
    if novelData.novel.currentScene.skipEnabled
      @complete()

  # Instantly show all text
  @complete: ->
    @printCompleted = true
    @currentOffset = 0
    # Re-enable skip button
    if document.querySelector("#skip-button") isnt null
      document.querySelector("#skip-button").disabled = true;
    # Play missed sounds and start missed music
    if not @buffersExecuted
      ss = []
      first = true
      if @fullText.indexOf("play-sound") > -1
        s = @fullText.split("play-sound ")
        for i in s
          if not first
            ss.push(i.split(/\s|\"/)[0])
          first = false
      if ss.length > 0
        for i in [0 .. ss.length]
          if not (ss[i] in @soundBuffer)
            SoundManager.playSound(Parser.parseStatement(ss[i]))
      ss = []
      first = true
      if @fullText.indexOf("play-music") > -1
        s = @fullText.split("play-music ")
        for i in s
          if not first
            ss.push(i.split(/\s|\"/)[0])
          first = false
      if ss.length > 0
        for i in [0 .. ss.length]
          if not (ss[i] in @musicBuffer)
            SoundManager.startMusic(Parser.parseStatement(ss[i]))
      ss = []
      first = true
      if @fullText.indexOf("stop-music") > -1
        s = @fullText.split("stop-music ")
        for i in s
          if not first
            ss.push(i.split(/\s|\"/)[0])
          first = false
      if ss.length > 0
        for i in [0 .. ss.length]
          if not (ss[i] in @stopMusicBuffer)
            SoundManager.stopMusic(Parser.parseStatement(ss[i]))
      ss = []
      first = true
      if @fullText.indexOf("execute-command") > -1
        s = @fullText.split("execute-command ")
        for i in s
          if not first
            ss.push(i.split(/\s|\"/)[0])
          first = false
      if ss.length > 0
        for i in [0 .. ss.length]
          if not (ss[i] in @executeBuffer) and ss[i] isnt undefined
            eval(novelData.parsedJavascriptCommands[parseInt(ss[i].substring(4,ss[i].length))])
      @buffersExecuted = true
    # Set printed text and update choices
    novelData.printedText = @fullText
    SceneManager.updateChoices()

  # Stop pause
  @unpause: () ->
    if document.querySelector("#continue-button") isnt null
      document.querySelector("#continue-button").style.display = 'none'
    if @pause is "input"
      @pause = 0

  # Fast text scrolling
  @fastScroll: () ->
    if novelData.novel.currentScene.skipEnabled
      @tickSpeedMultiplier = novelData.novel.settings.scrollSettings.fastScrollSpeedMultiplier

  # Stop fast text scrolling
  @stopFastScroll: () ->
    @tickSpeedMultiplier = 1

  # Set how frequently the scrolling sound is played
  @setTickSoundFrequency: (freq) ->
    threshold = novelData.novel.settings.scrollSettings.tickFreqThreshold
    @tickSoundFrequency = 1
    if freq <= (threshold * 2)
      @tickSoundFrequency = 2
    if freq <= (threshold)
      @tickSoundFrequency = 3

  # Show a new letter
  @onTick: ->
    if @pause isnt "input" and @pause > 0
      @pause--
    if @pause is 0
      if not @speedMod
        @interval = @defaultInterval
      if @defaultInterval is 0
        @complete()
        return
      if novelData.printedText is @fullText
        return
      offsetChanged = false
      while (@fullText[@currentOffset] is ' ' || @fullText[@currentOffset] is '<' || @fullText[@currentOffset] is '>')
        @readTags()
      novelData.printedText = @fullText.substring(0, @currentOffset)
      if not offsetChanged
        @currentOffset++
      if @currentOffset >= @fullText.length
        @complete()
        return
      @tickCounter++
      if @tickCounter >= @tickSoundFrequency
        if @scrollSound isnt "none" and @interval isnt 0
          if @scrollSound isnt null
            SoundManager.playSound(@scrollSound)
          else if (novelData.novel.currentScene.scrollSound isnt undefined)
            SoundManager.playSound(novelData.novel.currentScene.scrollSound)
          @tickCounter = 0
    @setTickSoundFrequency(@interval / @tickSpeedMultiplier)
    setTimeout (->
      TextPrinter.onTick()
      return
    ), @interval / @tickSpeedMultiplier

  # Skip chars that are not printed, and parse tags
  @readTags: ->
    if @fullText[@currentOffset] is ' '
      @currentOffset++
    if @fullText[@currentOffset] is '>'
      @currentOffset++
    if @fullText[@currentOffset] is '<'
      i = @currentOffset
      str = ""
      i++
      while (@fullText[i-1] isnt '>' and @fullText[i] isnt '<')
        str = str + @fullText[i]
        i++
      str = str.substring(1,str.length)
      if str.indexOf("display:none;") > -1
        disp = ""
        spans = 1
        while true
          i++
          disp = disp + @fullText[i]
          if disp.indexOf("/span") isnt -1
            spans--
            disp = ""
          else if disp.indexOf("span") isnt -1
            spans++
            disp = ""
          if spans is 0
            break
        i++
      # Buffering
      if str.indexOf("play-sound") > -1 and str.indexOf("display:none;") > -1
        s = str.split("play-sound ")
        s = s[1].split(/\s|\"/)[0]
        @soundBuffer.push(Parser.parseStatement(s))
      if str.indexOf("play-music") > -1 and str.indexOf("display:none;") > -1
        s = str.split("play-music ")
        s = s[1].split(/\s|\"/)[0]
        @musicBuffer.push(Parser.parseStatement(s))
      if str.indexOf("stop-music") > -1 and str.indexOf("display:none;") > -1
        s = str.split("stop-music ")
        s = s[1].split(/\s|\"/)[0]
        @stopMusicBuffer.push(Parser.parseStatement(s))
      if str.indexOf("execute-command") > -1 and str.indexOf("display:none;") > -1
        s = str.split("execute-command ")
        s = s[1].split(/\s|\"/)[0]
        @executeBuffer.push(Parser.parseStatement(s))
      if str.indexOf("display:none;") is -1
        if str.indexOf("play-sound") > -1
          s = str.split("play-sound ")
          s = s[1].split(/\s|\"/)[0]
          @soundBuffer.push(Parser.parseStatement(s))
          SoundManager.playSound(Parser.parseStatement(s))
        if str.indexOf("play-music") > -1
          s = str.split("play-music ")
          s = s[1].split(/\s|\"/)[0]
          @musicBuffer.push(Parser.parseStatement(s))
          SoundManager.startMusic(Parser.parseStatement(s))
        if str.indexOf("stop-music") > -1
          s = str.split("stop-music ")
          s = s[1].split(/\s|\"/)[0]
          @stopMusicBuffer.push(Parser.parseStatement(s))
          SoundManager.stopMusic(Parser.parseStatement(s))
        if str.indexOf("pause") > -1
          s = str.split("pause ")
          s = s[1].split(/\s|\"/)[0]
          @pause = s
          if @pause is "input"
            if document.querySelector("#continue-button") isnt null
              document.querySelector("#continue-button").style.display = 'inline';
        if str.indexOf("execute-command") > -1
          s = str.split("execute-command ")
          s = s[1].split(/\s|\"/)[0]
          @executeBuffer.push(s)
          if s isnt undefined
            eval(novelData.parsedJavascriptCommands[parseInt(s.substring(4,s.length))])
        if str.indexOf("set-speed") > -1
          s = str.split("set-speed ")
          s = s[1].split(/\s|\"/)[0]
          @interval = Parser.parseStatement(s)
          @speedMod = true
        if str.indexOf("default-speed") > -1
          @interval = @defaultInterval
          @speedMod = false
        if str.indexOf("set-scroll-sound") > -1
          s = str.split("set-scroll-sound ")
          s = s[1].split(/\s|\"/)[0]
          @scrollSound = Parser.parseStatement(s)
        if str.indexOf("default-scroll-sound") > -1
          @scrollSound = undefined
      @currentOffset = i
      @offsetChanged = true
