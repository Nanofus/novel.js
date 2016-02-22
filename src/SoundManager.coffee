
### SOUNDS ###

# A class for sound functions
class SoundManager

  # Play the default sound for clicking an item
  playDefaultClickSound: (name,clicked) ->
    @playSound(data.game.settings.soundSettings.defaultClickSound,false)

  # Play a sound by name
  playSound: (name, isMusic) ->
    for s in data.game.sounds
      if s.name == name
        sound = new Audio(gamePath+'/sounds/'+s.file)
        if isMusic
          sound.volume = data.game.settings.soundSettings.musicVolume
        else
          sound.volume = data.game.settings.soundSettings.soundVolume
        sound.play()
        return sound

  # Is music playing?
  isPlaying: (name) ->
    for i in data.music
      if i.paused
        return false
      else
        return true

  # Start music
  startMusic: (name) ->
    music = @playSound(name,true)
    music.addEventListener 'ended', (->
      @currentTime = 0
      @play()
      return
    ), false
    data.music.push {"name":name,"music":music}

  # Stop a music that was started previously
  stopMusic: (name) ->
    for i in data.music
      if name == i.name
        i.music.pause()
        index = data.music.indexOf(i)
        data.music.splice(index,1)
