
/* TEXT PRINTING (letter by letter etc.) */

class TextPrinter {

  constructor() {
    this.fullText = "";
    this.currentText = "";
    this.currentOffset = 0;
    this.defaultInterval = 0;
    this.soundBuffer = [];
    this.musicBuffer = [];
    this.stopMusicBuffer = [];
    this.executeBuffer = [];
    this.buffersExecuted = false;
    this.scrollSound = null;
    this.tickSoundFrequency = 1;
    this.tickCounter = 0;
    this.speedMod = false;
    this.tickSpeedMultiplier = 1;
    this.pause = 0;
    this.interval = 0;
    this.printCompleted = false;
  }

  // Print a scene's text - noBuffers prevents buffers from replaying when scene is not changed
  static printText(text, noBuffers) {
    this.printCompleted = false;
    this.currentText = "";
    UI.updateText(this.currentText);
    // Disable the skip button
    UI.disableSkipButton();
    // Hide the continue button
    UI.showContinueButton(false);
    this.fullText = text;
    //console.log fullText
    this.currentOffset = -1;
    this.soundBuffer = [];
    this.musicBuffer = [];
    this.stopMusicBuffer = [];
    this.executeBuffer = [];
    this.buffersExecuted = false;
    if (noBuffers) {
      this.buffersExecuted = true;
    }
    this.defaultInterval = novelData.novel.currentScene.scrollSpeed;
    this.setTickSoundFrequency(this.defaultInterval);
    if (novelData.novel.currentScene.visited && novelData.novel.currentScene.revisitSkipEnabled) {
      this.complete();
      return;
    }
    return setTimeout(this.onTick(),this.defaultInterval);
  }

  // Try to skip text, if allowed
  static trySkip() {
    if (novelData.novel.currentScene.skipEnabled) {
      return this.complete();
    }
  }

  // Instantly show all text
  static complete() {
    this.printCompleted = true;
    this.currentOffset = 0;
    // Re-enable skip button
    UI.enableSkipButton();
    // Play missed sounds and start missed music
    if (!this.buffersExecuted) {
      let ss = [];
      let first = true;
      // Play missed sounds
      if (this.fullText.indexOf("play-sound") > -1) {
        var s = this.fullText.split("play-sound ");
        for (let j = 0; j < s.length; j++) {
          var i = s[j];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable = __range__(0, ss.length, true);
        for (let k = 0; k < iterable.length; k++) {
          var i = iterable[k];
          if (!(__in__(ss[i], this.soundBuffer))) {
            SoundManager.playSound(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Play missed music
      if (this.fullText.indexOf("play-music") > -1) {
        var s = this.fullText.split("play-music ");
        for (let i1 = 0; i1 < s.length; i1++) {
          var i = s[i1];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable1 = __range__(0, ss.length, true);
        for (let j1 = 0; j1 < iterable1.length; j1++) {
          var i = iterable1[j1];
          if (!(__in__(ss[i], this.musicBuffer))) {
            SoundManager.startMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Stop missed music
      if (this.fullText.indexOf("stop-music") > -1) {
        var s = this.fullText.split("stop-music ");
        for (let k1 = 0; k1 < s.length; k1++) {
          var i = s[k1];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable2 = __range__(0, ss.length, true);
        for (let i2 = 0; i2 < iterable2.length; i2++) {
          var i = iterable2[i2];
          if (!(__in__(ss[i], this.stopMusicBuffer))) {
            SoundManager.stopMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Execute missed commands
      if (this.fullText.indexOf("execute-command") > -1) {
        var s = this.fullText.split("execute-command ");
        for (let j2 = 0; j2 < s.length; j2++) {
          var i = s[j2];
          if (!first) {
            ss.push(i.split(/\s|\"/)[0]);
          }
          first = false;
        }
      }
      if (ss.length > 0) {
        let iterable3 = __range__(0, ss.length, true);
        for (let k2 = 0; k2 < iterable3.length; k2++) {
          var i = iterable3[k2];
          if (!(__in__(ss[i], this.executeBuffer)) && ss[i] !== undefined) {
            eval(novelData.parsedJavascriptCommands[parseInt(ss[i].substring(4,ss[i].length))]);
          }
        }
      }
      this.buffersExecuted = true;
    }
    // Set printed text and update choices
    this.currentText = this.fullText;
    UI.updateText(this.currentText);
    return UI.updateChoices();
  }

  // Stop pause
  static unpause() {
    UI.showContinueButton(false);
    if (this.pause === "input") {
      return this.pause = 0;
    }
  }

  // Fast text scrolling
  static fastScroll() {
    if (novelData.novel.currentScene.skipEnabled) {
      return this.tickSpeedMultiplier = novelData.novel.settings.scrollSettings.fastScrollSpeedMultiplier;
    }
  }

  // Stop fast text scrolling
  static stopFastScroll() {
    return this.tickSpeedMultiplier = 1;
  }

  // Set how frequently the scrolling sound is played
  static setTickSoundFrequency(freq) {
    let threshold = novelData.novel.settings.scrollSettings.tickFreqThreshold;
    this.tickSoundFrequency = 1;
    if (freq <= (threshold * 2)) {
      this.tickSoundFrequency = 2;
    }
    if (freq <= (threshold)) {
      return this.tickSoundFrequency = 3;
    }
  }

  // Show a new letter
  static onTick() {
    // Do not continue if paused
    if (this.pause !== "input" && this.pause > 0) {
      this.pause--;
    }
    // Continue if not paused
    if (this.pause === 0) {
      if (!this.speedMod) {
        this.interval = this.defaultInterval;
      }
      // Instantly finish if interval is 0
      if (this.defaultInterval === 0) {
        this.complete();
        return;
      }
      // Return if all text is printed
      if (this.currentText === this.fullText) {
        return;
      }
      // Parse tags
      let offsetChanged = false;
      while (this.fullText[this.currentOffset] === ' ' || this.fullText[this.currentOffset] === '<' || this.fullText[this.currentOffset] === '>') {
        this.readTags();
      }
      // Move forward
      this.currentText = this.fullText.substring(0, this.currentOffset);
      UI.updateText(this.currentText);
      if (!offsetChanged) {
        this.currentOffset++;
      }
      // Complete if printing finished
      if (this.currentOffset >= this.fullText.length) {
        this.complete();
        return;
      }
      // Play tick sounds
      this.tickCounter++;
      if (this.tickCounter >= this.tickSoundFrequency) {
        if (this.scrollSound !== "none" && this.interval !== 0) {
          if (this.scrollSound !== null) {
            SoundManager.playSound(this.scrollSound);
          } else if (novelData.novel.currentScene.scrollSound !== undefined) {
            SoundManager.playSound(novelData.novel.currentScene.scrollSound);
          }
          this.tickCounter = 0;
        }
      }
    }
    // Set the tick sound frequency
    this.setTickSoundFrequency(this.interval / this.tickSpeedMultiplier);
    // Set the timeout until the next tick
    return setTimeout((function() {
      TextPrinter.onTick();
    }), this.interval / this.tickSpeedMultiplier);
  }

  // Skip chars that are not printed, and parse tags
  static readTags() {
    // Skip spaces and tag enders
    if (this.fullText[this.currentOffset] === ' ') {
      this.currentOffset++;
    }
    if (this.fullText[this.currentOffset] === '>') {
      this.currentOffset++;
    }
    // Tag starter found, start reading
    if (this.fullText[this.currentOffset] === '<') {
      let i = this.currentOffset;
      let str = "";
      i++;
      // Read the tag
      while (this.fullText[i-1] !== '>' && this.fullText[i] !== '<') {
        str = str + this.fullText[i];
        i++;
      }
      str = str.substring(1,str.length);
      // Do not print hidden text
      if (str.indexOf("display:none;") > -1) {
        let disp = "";
        let spans = 1;
        while (true) {
          i++;
          disp = disp + this.fullText[i];
          if (disp.indexOf("/span") !== -1) {
            spans--;
            disp = "";
          } else if (disp.indexOf("span") !== -1) {
            spans++;
            disp = "";
          }
          if (spans === 0) {
            break;
          }
        }
        i++;
      }
      // Buffering of hidden commands
      this.bufferHidden(str);
      // Executing of non-hidden commands
      this.bufferNonHidden(str);
      this.currentOffset = i;
      return this.offsetChanged = true;
    }
  }

  // Parse hidden tags
  static bufferHidden(str) {
    // Sound playing
    if (str.indexOf("play-sound") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("play-sound ");
      s = s[1].split(/\s|\"/)[0];
      this.soundBuffer.push(Parser.parseStatement(s));
    }
    // Music playing
    if (str.indexOf("play-music") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("play-music ");
      s = s[1].split(/\s|\"/)[0];
      this.musicBuffer.push(Parser.parseStatement(s));
    }
    // Music stopping
    if (str.indexOf("stop-music") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("stop-music ");
      s = s[1].split(/\s|\"/)[0];
      this.stopMusicBuffer.push(Parser.parseStatement(s));
    }
    // Command executing
    if (str.indexOf("execute-command") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("execute-command ");
      s = s[1].split(/\s|\"/)[0];
      return this.executeBuffer.push(Parser.parseStatement(s));
    }
  }

  // Parse visible tags
  static bufferNonHidden(str) {
    if (str.indexOf("display:none;") === -1) {
      // Sound playing
      if (str.indexOf("play-sound") > -1) {
        var s = str.split("play-sound ");
        s = s[1].split(/\s|\"/)[0];
        this.soundBuffer.push(Parser.parseStatement(s));
        SoundManager.playSound(Parser.parseStatement(s));
      }
      // Music playing
      if (str.indexOf("play-music") > -1) {
        var s = str.split("play-music ");
        s = s[1].split(/\s|\"/)[0];
        this.musicBuffer.push(Parser.parseStatement(s));
        SoundManager.startMusic(Parser.parseStatement(s));
      }
      // Music stopping
      if (str.indexOf("stop-music") > -1) {
        var s = str.split("stop-music ");
        s = s[1].split(/\s|\"/)[0];
        this.stopMusicBuffer.push(Parser.parseStatement(s));
        SoundManager.stopMusic(Parser.parseStatement(s));
      }
      // Pausing
      if (str.indexOf("pause") > -1) {
        var s = str.split("pause ");
        s = s[1].split(/\s|\"/)[0];
        this.pause = s;
        if (this.pause === "input") {
          UI.showContinueButton(true);
        }
      }
      // Command executing
      if (str.indexOf("execute-command") > -1) {
        var s = str.split("execute-command ");
        s = s[1].split(/\s|\"/)[0];
        this.executeBuffer.push(s);
        if (s !== undefined) {
          eval(novelData.parsedJavascriptCommands[parseInt(s.substring(4,s.length))]);
        }
      }
      // Speed setting
      if (str.indexOf("set-speed") > -1) {
        var s = str.split("set-speed ");
        s = s[1].split(/\s|\"/)[0];
        this.interval = Parser.parseStatement(s);
        this.speedMod = true;
      }
      // Speed resetting
      if (str.indexOf("default-speed") > -1) {
        this.interval = this.defaultInterval;
        this.speedMod = false;
      }
      // Scroll sound setting
      if (str.indexOf("set-scroll-sound") > -1) {
        var s = str.split("set-scroll-sound ");
        s = s[1].split(/\s|\"/)[0];
        this.scrollSound = Parser.parseStatement(s);
      }
      // Scroll sound resetting
      if (str.indexOf("default-scroll-sound") > -1) {
        return this.scrollSound = undefined;
      }
    }
  }
}

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
function __in__(needle, haystack) {
  return haystack.indexOf(needle) >= 0;
}
