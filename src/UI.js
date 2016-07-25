
/* UI SCRIPTS */

class UI {

  static init() {
    let n = document.getElementsByTagName('novel')[0];
    if (!n) {
      n = document.getElementById('novel-area');
    }
    if (n) {
      let d = document.createElement('div');
      d.id = "novel-area";
      d.innerHTML = `<div id="novel-style-area">
        <div id="novel-notification-wrapper">
          <div id="novel-save-notification" class="novel-notification">
            <p class="novel-save-text"></p>
            <p><textarea name="save-text" readonly></textarea></p>
            <p><button type="button" class="novel-close-button" onclick="UI.closeSaveNotification()"></button><button type="button" class="novel-copy-button" onclick="UI.copyText()"></button></p>
          </div>
          <div id="novel-load-notification" class="novel-notification">
            <p class="novel-load-text"></p>
            <p><textarea name="load-text"></textarea></p>
            <p><button type="button" class="novel-close-button" onclick="UI.closeLoadNotification(false)"></button><button type="button" class="novel-load-data-button" onclick="UI.closeLoadNotification(true)"></button></p>
          </div>
        </div>
        <div id="novel-text-area">
          <div id="novel-text"></div>
          <button type="button" class="novel-skip-button" onclick="TextPrinter.complete()"></button>
          <button type="button" class="novel-continue-button" onclick="TextPrinter.unpause()"></button>
        </div>
        <div id="novel-choices-area">
          <ul id="novel-choice-list"></ul>
        </div>
        <div id="novel-inventory-area">
          <h5 class="novel-inventory-title"></h5>
          <ul id="novel-inventory"></ul>
        </div>
        <div id="novel-hidden-inventory-area">
          <h5 class="novel-hidden-inventory-title"></h5>
          <ul id="novel-hidden-inventory"></ul>
        </div>
        <div id="novel-save-area">
          <button type="button" class="novel-save-button" onclick="NovelManager.saveData()"></button>
          <button type="button" class="novel-load-button" onclick="UI.showLoadNotification()"></button>
        </div>
      </div>`;
      n.parentNode.insertBefore(d, n);
      n.parentNode.removeChild(n);
      this.updateUILanguage();
      return;
    }
  }

  static updateUILanguage() {
    document.getElementsByClassName("novel-save-text")[0].innerHTML = LanguageManager.getUIString('saveText');
    document.getElementsByClassName("novel-load-text")[0].innerHTML = LanguageManager.getUIString('loadText');
    let iterable = document.getElementsByClassName("novel-close-button");
    for (let j = 0; j < iterable.length; j++) {
      let i = iterable[j];
      i.innerHTML = LanguageManager.getUIString('closeButton');
    }
    document.getElementsByClassName("novel-copy-button")[0].innerHTML = LanguageManager.getUIString('copyButton');
    document.getElementsByClassName("novel-skip-button")[0].innerHTML = LanguageManager.getUIString('skipButton');
    document.getElementsByClassName("novel-continue-button")[0].innerHTML = LanguageManager.getUIString('continueButton');
    document.getElementsByClassName("novel-inventory-title")[0].innerHTML = LanguageManager.getUIString('inventoryTitle');
    document.getElementsByClassName("novel-hidden-inventory-title")[0].innerHTML = LanguageManager.getUIString('hiddenInventoryTitle');
    document.getElementsByClassName("novel-load-button")[0].innerHTML = LanguageManager.getUIString('loadButton');
    document.getElementsByClassName("novel-load-data-button")[0].innerHTML = LanguageManager.getUIString('loadDataButton');
    document.getElementsByClassName("novel-save-button")[0].innerHTML = LanguageManager.getUIString('saveButton');
  }

  static updateStyle(style) {
    let e = document.getElementById("novel-style-area");
    if (style === undefined) {
      style = "";
    }
    e.setAttribute( 'class', style );
  }

  static disableSkipButton() {
    if (document.querySelector(".novel-skip-button") !== null) {
      document.querySelector(".novel-skip-button").disabled = true;
    }
  }

  static enableSkipButton() {
    if (document.querySelector(".novel-skip-button") !== null) {
      document.querySelector(".novel-skip-button").disabled = true;
    }
  }

  static showSkipButton(show) {
    let e = document.getElementsByClassName("novel-skip-button")[0];
    if (show && novelData.novel.settings.showSkipButton) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showChoicesArea(show) {
    let e = document.getElementById("novel-choices-area");
    if (show) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showInventoryArea(show) {
    let e = document.getElementById("novel-inventory-area");
    if (show) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showHiddenInventoryArea() {
    let e = document.getElementById("novel-hidden-inventory-area");
    if (novelData.novel.settings.debugMode) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showSaveButtons(show) {
    let e = document.getElementById("novel-save-area");
    if (show) {
      e.style.display = "inline";
    } else {
      e.style.display = "none";
    }
  }

  static showContinueButton(show) {
    if (document.querySelector(".novel-continue-button") !== null) {
      if (!show) {
        document.querySelector(".novel-continue-button").style.display = 'none';
      } else {
        document.querySelector(".novel-continue-button").style.display = 'inline';
      }
    }
  }

  static updateText(text) {
    let e = document.getElementById("novel-text");
    e.innerHTML = text;
  }

  // Show the save notification window, and update its text
  static showSaveNotification(text) {
    let e = document.getElementById("novel-save-notification");
    let textArea = e.querySelectorAll("textarea");
    textArea[0].value = text;
    e.style.display = 'block';
  }

  // Close the save notification window
  static closeSaveNotification() {
    let e = document.getElementById("novel-save-notification");
    e.style.display = 'none';
  }

  // Show the load notification window
  static showLoadNotification() {
    if (novelData.novel.settings.saveMode === "text") {
      let e = document.getElementById("novel-load-notification");
      e.style.display = 'block';
    } else {
      NovelManager.loadGame();
    }
  }

  // Close the load notification - if load, then load a save. ChangeScene defines whether the scene should be updated or not.
  static closeLoadNotification(load, changeScene) {
    let e = document.getElementById("novel-load-notification");
    if (load) {
      let textArea = e.querySelectorAll("textarea");
      NovelManager.loadData(textArea[0].value,changeScene);
      textArea[0].value = "";
    }
    e.style.display = 'none';
  }

  // Copy text from the save notification
  static copyText() {
    let copyTextarea = document.getElementById("novel-save-notification").querySelector("textarea");
    copyTextarea.select();
    try {
      let successful;
      return successful = document.execCommand('copy');
    } catch (err) {
      console.error(`Error! Copying to clipboard failed: ${err}`);
    }
  }

  // Update the values of the input fields
  static updateInputs(needForUpdate) {
    let inputs = document.getElementById("novel-area").querySelectorAll("input");
    for (let j = 0; j < inputs.length; j++) {
      let i = inputs[j];
      for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
        let a = novelData.novel.inventories[novelData.novel.currentInventory][k];
        if (a.name === i.className.substring(6,i.className.length)) {
          a.value = Util.stripHTML(i.value);
          if (needForUpdate) {
            SceneManager.updateScene(novelData.novel.currentScene,true);
          }
        }
      }
    }
  }

  // Reset all choices
  static resetChoices() {
    let choiceArea = document.getElementById("novel-choice-list");
    return (() => { let result = []; while (choiceArea.firstChild) {
      result.push(choiceArea.removeChild(choiceArea.firstChild));
    } return result; })();
  }

  // Reset the inventories
  static resetInventories() {
    let inventoryArea = document.getElementById("novel-inventory");
    while (inventoryArea.firstChild) {
      inventoryArea.removeChild(inventoryArea.firstChild);
    }
    inventoryArea = document.getElementById("novel-hidden-inventory");
    return (() => { let result = []; while (inventoryArea.firstChild) {
      result.push(inventoryArea.removeChild(inventoryArea.firstChild));
    } return result; })();
  }

  // Update the choices
  static updateChoices() {
    this.resetChoices();
    let choiceArea = document.getElementById("novel-choice-list");
    let i = 0;
    let iterable = __range__(0, novelData.novel.currentScene.choices.length, false);
    for (let j = 0; j < novelData.novel.currentScene.choices.length; j++) {
      i = iterable[j];
      let choice = novelData.novel.currentScene.choices[i];
      if (choice.text) {
        choice.parsedText = Parser.parseText(LanguageManager.getCorrectLanguageString(choice.text));
        if (SceneManager.requirementsFilled(choice)) {
          var li = document.createElement("li");
          li.innerHTML = `<a href="#"; onclick="SceneManager.selectChoiceById(${i})">${choice.parsedText}</a>`;
          choiceArea.appendChild(li);
        } else if (choice.alwaysShow || novelData.novel.settings.alwaysShowDisabledChoices) {
          var li = document.createElement("li");
          li.innerHTML = choice.parsedText;
          choiceArea.appendChild(li);
        }
      }
    }
  }

  // Update the inventory items
  static updateInventories() {
    this.resetInventories();
    let inventoryArea = document.getElementById("novel-inventory");
    let hiddenInventoryArea = document.getElementById("novel-hidden-inventory");
    for (let i = 0; i < novelData.novel.inventories[novelData.novel.currentInventory].length; i++) {
      let item = novelData.novel.inventories[novelData.novel.currentInventory][i];
      let targetInventory = hiddenInventoryArea;
      if (!item.hidden || item.hidden === undefined) {
        targetInventory = inventoryArea;
      }
      if (item.value > 0 || isNaN(item.value)) {
        let li = document.createElement("li");
        li.class = "novel-inventory-item";
        let innerHTML = LanguageManager.getItemAttribute(item,'displayName') + ' - ' + item.value;
        innerHTML = innerHTML + '<ul class="novel-inventory-item-info">';
        if (item.description) {
          innerHTML = innerHTML + '<li class="novel-inventory-item-description">' + LanguageManager.getItemAttribute(item,'description') + '</li>';
        }
        innerHTML = innerHTML + '</ul>';
        li.innerHTML = innerHTML;
        targetInventory.appendChild(li);
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
