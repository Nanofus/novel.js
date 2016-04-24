
### SOUNDS ###

# A class for sound functions
class SoundManager

  # Create instance
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  # Load all sounds
  @init: () ->
    index = 0
    for s in novelData.novel.sounds
      s.sound = new Audio(novelPath+'/sounds/'+s.file)
      index++

  # Play the default sound for clicking an item
  @playDefaultClickSound: (name,clicked) ->
    @playSound(novelData.novel.settings.soundSettings.defaultClickSound,false)

  # Play a sound by name
  @playSound: (name, isMusic) ->
    if name is undefined
      return
    name = Parser.selectRandomOption(name);
    for s in novelData.novel.sounds
      if s.name is name
        sound = s.sound
        if isMusic
          sound.volume = novelData.novel.settings.soundSettings.musicVolume
        else
          sound.volume = novelData.novel.settings.soundSettings.soundVolume
        sound.play()
        return sound

  # Is music playing?
  @isPlaying: (name) ->
    for i in novelData.music
      if i.paused
        return false
      else
        return true

  # Start music
  @startMusic: (name) ->
    for m in novelData.music
      if m.name is name
        return
    music = @playSound(name,true)
    if music is undefined
      return
    music.addEventListener 'ended', (->
      @currentTime = 0
      @play()
      return
    ), false
    novelData.music.push {"name":name,"music":music}

  # Stop a music that was started previously
  @stopMusic: (name) ->
    for i in novelData.music
      if name is i.name
        i.music.pause()
        index = novelData.music.indexOf(i)
        novelData.music.splice(index,1)
