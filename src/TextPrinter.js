
/* TEXT PRINTING (letter by letter etc.) */

class TextPrinter {

  // Print a scene's text - noBuffers prevents buffers from replaying when scene is not changed
  static printText(text, noBuffers) {
    novelData.printer.printCompleted = false;
    novelData.printer.currentText = "";
    UI.updateText(novelData.printer.currentText);
    // Disable the skip button
    UI.disableSkipButton();
    // Hide the continue button
    UI.showContinueButton(false);
    novelData.printer.fullText = text;
    //console.log fullText
    novelData.printer.currentOffset = -1;
    novelData.printer.soundBuffer = [];
    novelData.printer.musicBuffer = [];
    novelData.printer.stopMusicBuffer = [];
    novelData.printer.executeBuffer = [];
    novelData.printer.buffersExecuted = false;
    if (noBuffers) {
      novelData.printer.buffersExecuted = true;
    }
    novelData.printer.defaultInterval = novelData.novel.currentScene.scrollSpeed;
    this.setTickSoundFrequency(novelData.printer.defaultInterval);
    if (novelData.novel.currentScene.visited && novelData.novel.currentScene.revisitSkipEnabled) {
      this.complete();
      return;
    }
    return setTimeout(this.onTick(),novelData.printer.defaultInterval);
  }

  // Try to skip text, if allowed
  static trySkip() {
    if (novelData.novel.currentScene.skipEnabled) {
      this.complete();
    }
  }

  // Instantly show all text
  static complete() {
    novelData.printer.printCompleted = true;
    novelData.printer.currentOffset = 0;
    // Re-enable skip button
    UI.enableSkipButton();
    // Play missed sounds and start missed music
    this.executeBuffers();
    // Set printed text and update choices
    novelData.printer.currentText = novelData.printer.fullText;
    UI.updateText(novelData.printer.currentText);
    UI.updateChoices();
  }

  static executeBuffers() {
    if (!novelData.printer.buffersExecuted) {
      let ss = [];
      let first = true;
      // Play missed sounds
      if (novelData.printer.fullText.indexOf("play-sound") > -1) {
        var s = novelData.printer.fullText.split("play-sound ");
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
          if (!(__in__(ss[i], novelData.printer.soundBuffer))) {
            SoundManager.playSound(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Play missed music
      if (novelData.printer.fullText.indexOf("play-music") > -1) {
        var s = novelData.printer.fullText.split("play-music ");
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
          if (!(__in__(ss[i], novelData.printer.musicBuffer))) {
            SoundManager.startMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Stop missed music
      if (novelData.printer.fullText.indexOf("stop-music") > -1) {
        var s = novelData.printer.fullText.split("stop-music ");
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
          if (!(__in__(ss[i], novelData.printer.stopMusicBuffer))) {
            SoundManager.stopMusic(Parser.parseStatement(ss[i]));
          }
        }
      }
      ss = [];
      first = true;
      // Execute missed commands
      if (novelData.printer.fullText.indexOf("execute-command") > -1) {
        var s = novelData.printer.fullText.split("execute-command ");
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
          if (!(__in__(ss[i], novelData.printer.executeBuffer)) && ss[i] !== undefined) {
            eval(novelData.parsedJavascriptCommands[parseInt(ss[i].substring(4,ss[i].length))]);
          }
        }
      }
      novelData.printer.buffersExecuted = true;
    }
  }

  // Stop pause
  static unpause() {
    UI.showContinueButton(false);
    if (novelData.printer.pause === "input") {
      novelData.printer.pause = 0;
    }
  }

  // Fast text scrolling
  static fastScroll() {
    if (novelData.novel.currentScene.skipEnabled) {
      novelData.printer.tickSpeedMultiplier = novelData.novel.settings.scrollSettings.fastScrollSpeedMultiplier;
    }
  }

  // Stop fast text scrolling
  static stopFastScroll() {
    novelData.printer.tickSpeedMultiplier = 1;
  }

  // Set how frequently the scrolling sound is played
  static setTickSoundFrequency(freq) {
    let threshold = novelData.novel.settings.scrollSettings.tickFreqThreshold;
    novelData.printer.tickSoundFrequency = 1;
    if (freq <= (threshold * 2)) {
      novelData.printer.tickSoundFrequency = 2;
    }
    if (freq <= (threshold)) {
      novelData.printer.tickSoundFrequency = 3;
    }
  }

  // Show a new letter
  static onTick() {
    // Do not continue if paused
    if (novelData.printer.pause !== "input" && novelData.printer.pause > 0) {
      novelData.printer.pause--;
    }
    // Continue if not paused
    if (novelData.printer.pause === 0) {
      if (!novelData.printer.speedMod) {
        novelData.printer.interval = novelData.printer.defaultInterval;
      }
      // Instantly finish if interval is 0
      if (novelData.printer.defaultInterval === 0) {
        this.complete();
        return;
      }
      // Return if all text is printed
      if (novelData.printer.currentText === novelData.printer.fullText) {
        return;
      }
      // Parse tags
      let offsetChanged = false;
      while (novelData.printer.fullText[novelData.printer.currentOffset] === ' ' || novelData.printer.fullText[novelData.printer.currentOffset] === '<' || novelData.printer.fullText[novelData.printer.currentOffset] === '>') {
        this.readTags();
      }
      // Move forward
      novelData.printer.currentText = novelData.printer.fullText.substring(0, novelData.printer.currentOffset);
      UI.updateText(novelData.printer.currentText);
      if (!offsetChanged) {
        novelData.printer.currentOffset++;
      }
      // Complete if printing finished
      if (novelData.printer.currentOffset >= novelData.printer.fullText.length) {
        this.complete();
        return;
      }
      // Play tick sounds
      novelData.printer.tickCounter++;
      if (novelData.printer.tickCounter >= novelData.printer.tickSoundFrequency) {
        if (novelData.printer.scrollSound !== "none" && novelData.printer.interval !== 0) {
          if (novelData.printer.scrollSound !== null) {
            SoundManager.playSound(novelData.printer.scrollSound);
          } else if (novelData.novel.currentScene.scrollSound !== undefined) {
            SoundManager.playSound(novelData.novel.currentScene.scrollSound);
          }
          novelData.printer.tickCounter = 0;
        }
      }
    }
    // Set the tick sound frequency
    this.setTickSoundFrequency(novelData.printer.interval / novelData.printer.tickSpeedMultiplier);
    // Set the timeout until the next tick
    return setTimeout((function() {
      TextPrinter.onTick();
    }), novelData.printer.interval / novelData.printer.tickSpeedMultiplier);
  }

  // Skip chars that are not printed, and parse tags
  static readTags() {
    // Skip spaces and tag enders
    if (novelData.printer.fullText[novelData.printer.currentOffset] === ' ') {
      novelData.printer.currentOffset++;
    }
    if (novelData.printer.fullText[novelData.printer.currentOffset] === '>') {
      novelData.printer.currentOffset++;
    }
    // Tag starter found, start reading
    if (novelData.printer.fullText[novelData.printer.currentOffset] === '<') {
      let i = novelData.printer.currentOffset;
      let str = "";
      i++;
      // Read the tag
      while (novelData.printer.fullText[i-1] !== '>' && novelData.printer.fullText[i] !== '<') {
        str = str + novelData.printer.fullText[i];
        i++;
      }
      str = str.substring(1,str.length);
      // Do not print hidden text
      if (str.indexOf("display:none;") > -1) {
        let disp = "";
        let spans = 1;
        while (true) {
          i++;
          disp = disp + novelData.printer.fullText[i];
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
      novelData.printer.currentOffset = i;
      novelData.printer.offsetChanged = true;
    }
  }

  // Parse hidden tags
  static bufferHidden(str) {
    // Sound playing
    if (str.indexOf("play-sound") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("play-sound ");
      s = s[1].split(/\s|\"/)[0];
      novelData.printer.soundBuffer.push(Parser.parseStatement(s));
    }
    // Music playing
    if (str.indexOf("play-music") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("play-music ");
      s = s[1].split(/\s|\"/)[0];
      novelData.printer.musicBuffer.push(Parser.parseStatement(s));
    }
    // Music stopping
    if (str.indexOf("stop-music") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("stop-music ");
      s = s[1].split(/\s|\"/)[0];
      novelData.printer.stopMusicBuffer.push(Parser.parseStatement(s));
    }
    // Command executing
    if (str.indexOf("execute-command") > -1 && str.indexOf("display:none;") > -1) {
      var s = str.split("execute-command ");
      s = s[1].split(/\s|\"/)[0];
      return novelData.printer.executeBuffer.push(Parser.parseStatement(s));
    }
  }

  // Parse visible tags
  static bufferNonHidden(str) {
    if (str.indexOf("display:none;") === -1) {
      // Sound playing
      if (str.indexOf("play-sound") > -1) {
        var s = str.split("play-sound ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.soundBuffer.push(Parser.parseStatement(s));
        SoundManager.playSound(Parser.parseStatement(s));
      }
      // Music playing
      if (str.indexOf("play-music") > -1) {
        var s = str.split("play-music ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.musicBuffer.push(Parser.parseStatement(s));
        SoundManager.startMusic(Parser.parseStatement(s));
      }
      // Music stopping
      if (str.indexOf("stop-music") > -1) {
        var s = str.split("stop-music ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.stopMusicBuffer.push(Parser.parseStatement(s));
        SoundManager.stopMusic(Parser.parseStatement(s));
      }
      // Pausing
      if (str.indexOf("pause") > -1) {
        var s = str.split("pause ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.pause = s;
        if (novelData.printer.pause === "input") {
          UI.showContinueButton(true);
        }
      }
      // Command executing
      if (str.indexOf("execute-command") > -1) {
        var s = str.split("execute-command ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.executeBuffer.push(s);
        if (s !== undefined) {
          eval(novelData.parsedJavascriptCommands[parseInt(s.substring(4,s.length))]);
        }
      }
      // Speed setting
      if (str.indexOf("set-speed") > -1) {
        var s = str.split("set-speed ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.interval = Parser.parseStatement(s);
        novelData.printer.speedMod = true;
      }
      // Speed resetting
      if (str.indexOf("default-speed") > -1) {
        novelData.printer.interval = novelData.printer.defaultInterval;
        novelData.printer.speedMod = false;
      }
      // Scroll sound setting
      if (str.indexOf("set-scroll-sound") > -1) {
        var s = str.split("set-scroll-sound ");
        s = s[1].split(/\s|\"/)[0];
        novelData.printer.scrollSound = Parser.selectRandomOption(novelData.parsedScrollsounds[parseInt(s.substring(2,s.length))][1]);
        console.log(novelData.printer.scrollSound + " ---")
      }
      // Scroll sound resetting
      if (str.indexOf("default-scroll-sound") > -1) {
        return novelData.printer.scrollSound = undefined;
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
