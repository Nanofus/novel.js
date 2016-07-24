
/* UTILITY SCRIPTS */

class Util {

  // Check if a value is even or not
  static isEven(n) {
    return n % 2 === 0;
  }

  // Check if a value is odd or not
  static isOdd(n) {
    return Math.abs(n % 2) === 1;
  }

  // Remove HTML tags from a string - used to clean input
  static stripHTML(text) {
    let regex = /(<([^>]+)>)/ig;
    return text.replace(regex, '');
  }

  // Check if a variable is the chosen format
  static checkFormat(s, format, suppressErrors) {
    if (suppressErrors === undefined) {
      suppressErrors = false;
    }
    if (format === 'array') {
      if (Object.prototype.toString.call(s) === '[object Array]') {
        return true;
      } else {
        if (!suppressErrors) {
          console.error(`ERROR: Invalid input format (should be ${format})`);
        }
        return false;
      }
    } else if (format === 'arrayOrString') {
      if (Object.prototype.toString.call(s) === '[object Array]' || typeof s === 'string') {
        return true;
      } else {
        if (!suppressErrors) {
          console.error(`ERROR: Invalid input format (should be ${format})`);
        }
        return false;
      }
    } else {
      if (typeof s === format) {
        return true;
      } else {
        if (!suppressErrors) {
          console.error(`ERROR: Invalid input format (should be ${format})`);
        }
        return false;
      }
    }
  }

  // Check if the string has valid parentheses
  static validateParentheses(s) {
    let open = 0;
    for (let j = 0; j < s.length; j++) {
      let i = s[j];
      if (i === "(") {
        open++;
      }
      if (i === ")") {
        if (open > 0) {
          open--;
        } else {
          return false;
        }
      }
    }
    if (open === 0) {
      return true;
    } else {
      return false;
    }
  }

  // Check if [] parentheses are valid - ignore /[ and /]
  static validateTagParentheses(s) {
    let open = 0;
    let index = 0;
    for (let j = 0; j < s.length; j++) {
      let i = s[j];
      if (i === "[") {
        if (s[index-1]) {
          if (s[index-1] !== "/") {
            open++;
          }
        } else {
          open++;
        }
      }
      if (i === "]") {
        if (s[index-1]) {
          if (s[index-1] !== "/") {
            if (open > 0) {
              open--;
            } else {
              return false;
            }
          }
        } else {
          if (open > 0) {
            open--;
          } else {
            return false;
          }
        }
      }
      index++;
    }
    if (open === 0) {
      return true;
    } else {
      return false;
    }
  }

  // Merge two object arrays into one
  static mergeObjArrays(list1, list2) {
    let result = {};
    list1.concat(list2).forEach(function(item) {
      let { name } = item;
      let row = result[name];
      if (!row) {
        result[name] = item;
        return;
      }
      for (let column in item) {
        row[column] = item[column];
      }
    });
    let finalResult = Object.keys(result).map(name => result[name]);
    return finalResult;
  }
}
