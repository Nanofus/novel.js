
/* SOUNDS */

// A class for sound functions
class SoundManager {

  // Load all sounds
  static init() {
    let index = 0;
    for (let i = 0; i < novelData.novel.sounds.length; i++) {
      let s = novelData.novel.sounds[i];
      s.sound = new Audio(novelPath+'/sounds/'+s.file);
      index++;
    }
  }

  // Play the default sound for clicking an item
  static playDefaultClickSound(name,clicked) {
    return this.playSound(novelData.novel.settings.soundSettings.defaultClickSound,false);
  }

  // Play a sound by name
  static playSound(name, isMusic) {
    if (name === undefined) {
      return;
    }
    name = Parser.selectRandomOption(name);
    for (let i = 0; i < novelData.novel.sounds.length; i++) {
      let s = novelData.novel.sounds[i];
      if (s.name === name) {
        let { sound } = s;
        if (isMusic) {
          sound.volume = novelData.novel.settings.soundSettings.musicVolume;
        } else {
          sound.volume = novelData.novel.settings.soundSettings.soundVolume;
        }
        sound.play();
        return sound;
      }
    }
  }

  // Is music playing?
  static isPlaying(name) {
    for (let j = 0; j < novelData.music.length; j++) {
      let i = novelData.music[j];
      if (i.paused) {
        return false;
      } else {
        return true;
      }
    }
  }

  // Start music
  static startMusic(name) {
    for (let i = 0; i < novelData.music.length; i++) {
      let m = novelData.music[i];
      if (m.name === name) {
        return;
      }
    }
    let music = this.playSound(name,true);
    if (music === undefined) {
      return;
    }
    music.addEventListener('ended', (function() {
      this.currentTime = 0;
      this.play();
    }), false);
    return novelData.music.push({"name":name,"music":music});
  }

  // Stop a music that was started previously
  static stopMusic(name) {
    for (let j = 0; j < novelData.music.length; j++) {
      let i = novelData.music[j];
      if (name === i.name) {
        i.music.pause();
        let index = novelData.music.indexOf(i);
        novelData.music.splice(index,1);
      }
    }
  }
}
