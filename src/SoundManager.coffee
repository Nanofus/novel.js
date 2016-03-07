
### SOUNDS ###

# A class for sound functions
class SoundManager
  sounds = []

  # Load all sounds
  init: () ->
    index = 0
    for s in novelData.novel.sounds
      s.sound = new Audio(novelPath+'/sounds/'+s.file)
      sounds[index] = s
      index++

  # Play the default sound for clicking an item
  playDefaultClickSound: (name,clicked) ->
    @playSound(novelData.novel.settings.soundSettings.defaultClickSound,false)

  # Play a sound by name
  playSound: (name, isMusic) ->
    if name == undefined
      return
    name = parser.selectRandomOption(name);
    for s in novelData.novel.sounds
      if s.name == name
        sound = s.sound
        if isMusic
          sound.volume = novelData.novel.settings.soundSettings.musicVolume
        else
          sound.volume = novelData.novel.settings.soundSettings.soundVolume
        sound.play()
        return sound

  # Is music playing?
  isPlaying: (name) ->
    for i in novelData.music
      if i.paused
        return false
      else
        return true

  # Start music
  startMusic: (name) ->
    for m in novelData.music
      if m.name == name
        return
    music = @playSound(name,true)
    if music == undefined
      return
    music.addEventListener 'ended', (->
      @currentTime = 0
      @play()
      return
    ), false
    novelData.music.push {"name":name,"music":music}

  # Stop a music that was started previously
  stopMusic: (name) ->
    for i in novelData.music
      if name == i.name
        i.music.pause()
        index = novelData.music.indexOf(i)
        novelData.music.splice(index,1)
