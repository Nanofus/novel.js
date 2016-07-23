
/* HANDLES KEYBOARD INPUT */

class InputManager {

  // Gets key down and handles their functions
  static keyDown(charCode) {
    if (this.formsSelected()) {
      return;
    }
    // Use SPACE to skip or continue
    if (charCode === 13 || charCode === 32) {
      if (novelData.novel.settings.scrollSettings.continueWithKeyboard) {
        SceneManager.tryContinue();
      }
      if (novelData.novel.settings.scrollSettings.skipWithKeyboard) {
        TextPrinter.trySkip();
      }
      return TextPrinter.unpause();
    }
  }

  // Gets key being pressed
  static keyPressed(charCode) {
    if (this.formsSelected()) {
      return;
    }
    novelData.input.presses++;
    // Use SPACE to fast scroll
    if (charCode === 13 || charCode === 32) {
      if (novelData.input.presses > 2) {
        if (novelData.novel.settings.scrollSettings.fastScrollWithKeyboard) {
          return TextPrinter.fastScroll();
        }
      }
    }
  }

  // Gets key release
  static keyUp(charCode) {
    if (this.formsSelected()) {
      return;
    }
    this.presses = 0;
    // Release SPACE to stop fast scroll
    if (charCode === 13 || charCode === 32) {
      return TextPrinter.stopFastScroll();
    }
  }

  // Checks if any forms on the page are active
  static formsSelected() {
    let novelArea = document.getElementById("novel-area");
    if (novelArea) {
      let inputs = novelArea.querySelectorAll("input");
      for (let j = 0; j < inputs.length; j++) {
        let i = inputs[j];
        if (i === document.activeElement) {
          return true;
        }
      }
    }
    return false;
  }
}

document.onkeydown = function(evt) {
  evt = evt || window.event;
  let charCode = evt.keyCode || evt.which;
  return InputManager.keyDown(charCode);
};

document.onkeypress = function(evt) {
  evt = evt || window.event;
  let charCode = evt.keyCode || evt.which;
  return InputManager.keyPressed(charCode);
};

document.onkeyup = function(evt) {
  evt = evt || window.event;
  let charCode = evt.keyCode || evt.which;
  return InputManager.keyUp(charCode);
};
