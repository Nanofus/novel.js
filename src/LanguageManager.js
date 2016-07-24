
/* HANDLES LANGUAGE SETTINGS */

class LanguageManager {

  // Change the novel's language
  static setLanguage(name) {
    novelData.novel.settings.language = name;
    return UI.updateUILanguage();
  }

  // Get a string shown in UI in the current language
  static getUIString(name) {
    Util.checkFormat(name,'string');
    for (let j = 0; j < novelData.novel.uiText.length; j++) {
      let i = novelData.novel.uiText[j];
      if (i.name === name && i.language === novelData.novel.settings.language) {
        return Parser.parseText(i.content);
      }
    }
    console.error(`Error! UI string ${name} not found!`);
    return '[NOT FOUND]';
  }

  // Get the correct version of csv string
  static getCorrectLanguageCsvString(name) {
    Util.checkFormat(name,'string');
    if (novelData.csvData === undefined || novelData.csvEnabled === false) {
      console.error("Error! CSV data cannot be parsed, because Papa Parse can't be detected.");
      return '[NOT FOUND]';
    }
    for (let j = 0; j < novelData.csvData.length; j++) {
      let i = novelData.csvData[j];
      if (i.name === name) {
        if (i[novelData.novel.settings.language] === undefined) {
          if (i['english'] === undefined) {
            console.error(`Error! No CSV value by name ${name} could be found.`);
            return '[NOT FOUND]';
          }
          return Parser.parseText(i['english']);
        }
        return Parser.parseText(i[novelData.novel.settings.language]);
      }
    }
  }

  // Get an item's attribute in the correct language
  static getItemAttribute(item, type) {
    switch (type) {
      case 'displayName':
        if (item.displayName === '[csv]') {
          return this.getCorrectLanguageCsvString(item.name + '|displayName');
        } else {
          return this.getCorrectLanguageString(item.displayName);
        }
        break;
      case 'description':
        if (item.description === '[csv]') {
          return this.getCorrectLanguageCsvString(item.name + '|description');
        } else {
          return this.getCorrectLanguageString(item.description);
        }
        break;
      default:
        console.error('Error! Trying to get an invalid item attribute in LanguageManager.');
        return '[NOT FOUND]';
        break;
    }
  }

  // Get the string in the correct language
  static getCorrectLanguageString(obj, type) {
    Util.checkFormat(obj,'arrayOrString');
    if (typeof obj === "string") {
      return obj;
    }
    if (Object.prototype.toString.call(obj) === '[object Array]') {
      for (let j = 0; j < obj.length; j++) {
        let i = obj[j];
        if (i.language === novelData.novel.settings.language) {
          return i.content;
        }
      }
    }
  }
}
