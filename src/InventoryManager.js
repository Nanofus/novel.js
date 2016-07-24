
/* INVENTORY, STAT & VALUE OPERATIONS */

class InventoryManager {

  // Check if item or stat requirements have been filled
  static checkRequirements(requirements) {
    Util.checkFormat(requirements,'array');
    let reqsFilled = 0;
    // Go through all requirements
    for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
      let i = novelData.novel.inventories[novelData.novel.currentInventory][k];
      for (let i1 = 0; i1 < requirements.length; i1++) {
        let j = requirements[i1];
        if (j[0] === i.name) {
          if (j[1] <= i.value) {
            reqsFilled = reqsFilled + 1;
          }
        }
      }
    }
    // Check whether all requirements have been filled
    if (reqsFilled === requirements.length) {
      return true;
    } else {
      return false;
    }
  }

  // Set a value in JSON
  static setValue(parsed, newValue) {
    Util.checkFormat(parsed,'string');
    let getValueArrayLast = this.getValueArrayLast(parsed);
    let value = Parser.findValue(parsed,false);
    return value[getValueArrayLast] = newValue;
  }

  // Increase a value in JSON
  static increaseValue(parsed, change) {
    Util.checkFormat(parsed,'string');
    let getValueArrayLast = this.getValueArrayLast(parsed);
    let value = Parser.findValue(parsed,false);
    value[getValueArrayLast] = value[getValueArrayLast] + change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));
    }
  }

  // Decrease a value in JSON
  static decreaseValue(parsed, change) {
    Util.checkFormat(parsed,'string');
    let getValueArrayLast = this.getValueArrayLast(parsed);
    let value = Parser.findValue(parsed,false);
    value[getValueArrayLast] = value[getValueArrayLast] - change;
    if (!isNaN(parseFloat(value[getValueArrayLast]))) {
      return value[getValueArrayLast] = parseFloat(value[getValueArrayLast].toFixed(novelData.novel.settings.floatPrecision));
    }
  }

  // Get the last item in a value array
  static getValueArrayLast(parsed) {
    let getValueArrayLast = parsed.split(",");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1].split(".");
    getValueArrayLast = getValueArrayLast[getValueArrayLast.length-1];
    return getValueArrayLast;
  }

  // Add items
  static addItems(items) {
    return this.editItems(items, "add");
  }

  // Set items
  static setItems(items) {
    return this.editItems(items, "set");
  }

  // Remove items
  static removeItems(items) {
    return this.editItems(items, "remove");
  }

  // Edit the player's items or stats
  static editItems(items, mode) {
    Util.checkFormat(items,'array');
    for (let i = 0; i < items.length; i++) {
      let j = items[i];
      let hidden = false;
      // If the item name begins with a "!", it is hidden
      if (j[0].substring(0,1) === "!") {
        hidden = true;
        j[0] = j[0].substring(1,j[0].length);
      }
      // Try to edit the item in the current inventory
      let itemAdded = this.tryEditInInventory(mode, j, hidden);
      // If it failed, add a new item
      if (!itemAdded) {
        this.tryEditNotInInventory(mode, j, hidden);
      }
    }
  }

  // Try to edit an existing item
  static tryEditInInventory(mode, j, hidden) {
    for (let k = 0; k < novelData.novel.inventories[novelData.novel.currentInventory].length; k++) {
      // If the item exists in the current inventory
      let i = novelData.novel.inventories[novelData.novel.currentInventory][k];
      if (i.name === j[0]) {
        let probability = 1;
        // Check the string for display names and probabilities
        if (j.length > 2) {
          var displayName = j[2];
          var value = parseInt(Parser.parseStatement(j[1]));
          if (!isNaN(displayName)) {
            probability = j[2];
            displayName = j.name;
          }
          if (j.length > 3) {
            probability = parseFloat(j[2]);
            displayName = j[3];
          }
        } else {
          var displayName = j[0];
          var value = parseInt(Parser.parseStatement(j[1]));
        }
        // Generate a random value to determine whether to continue
        let random = Math.random();
        if (random < probability) {
          // Set the item's value
          if (mode === "set") {
            if (isNaN(parseInt(j[1]))) {
              i.value = j[1];
            } else {
              i.value = parseInt(j[1]);
            }
          // Add to the item's value - if it was a string, change it into a number
          } else if (mode === "add") {
            if (isNaN(parseInt(i.value))) {
              i.value = 0;
            }
            i.value = parseInt(i.value) + value;
          // Deduct from the item's value - if it's a string, change it into 0
          } else if (mode === "remove") {
            if (!isNaN(parseInt(i.value))) {
              i.value = parseInt(i.value) - value;
              if (i.value < 0) {
                i.value = 0;
              }
            } else {
              i.value = 0;
            }
          }
          // Set whether to hide the item or not
          i.hidden = hidden;
        }
        return true;
      }
    }
    return false;
  }

  // Edit an item that does not exist in inventory yet
  static tryEditNotInInventory(mode, j, hidden) {
    // Only do this if we don't want to remove anything
    if (mode !== "remove") {
      let probability = 1;
      // Check the string for display names and probablities
      let value = parseInt(Parser.parseStatement(j[1]));
      if (isNaN(value)) {
        value = Parser.parseStatement(j[1]);
      }
      if (j.length > 2) {
        var displayName = j[2];
        if (!isNaN(displayName)) {
          probability = j[2];
          displayName = j.name;
        }
        if (j.length > 3) {
          probability = parseFloat(j[2]);
          displayName = j[3];
        }
      } else {
        var displayName = j[0];
      }
      let random = Math.random();
      // Set the display name
      if (displayName === undefined) {
        var displayName = j[0];
      }
      // If we're lucky enough, add the new item
      if (random < probability) {
        return novelData.novel.inventories[novelData.novel.currentInventory].push({"name": j[0], "value": value, "displayName": displayName, "hidden": hidden});
      }
    }
  }
}
