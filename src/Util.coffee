
### UTILITY SCRIPTS ###

class Util

  # Check if a value is even or not
  isEven: (n) ->
    n % 2 == 0

  # Check if a value is odd or not
  isOdd: (n) ->
    Math.abs(n % 2) == 1

  # Remove HTML tags from a string - used to clean input
  stripHTML: (text) ->
    regex = /(<([^>]+)>)/ig
    text.replace regex, ''

  # Check if a variable is the chosen format
  checkFormat: (s, format) ->
    if format == 'array'
      if Object::toString.call(s) == '[object Array]'
        return true
      else
        console.error "ERROR: Invalid input format (should be " + format + ")"
        return false
    else if format == 'arrayOrString'
      if Object::toString.call(s) == '[object Array]' || typeof s == 'string'
        return true
      else
        console.error "ERROR: Invalid input format in (should be " + format + ")"
        return false
    else
      if typeof s == format
        return true
      else
        console.error "ERROR: Invalid input format in (should be " + format + ")"
        return false

  # Check if the string has valid parentheses
  validateParentheses: (s) ->
    open = 0
    for i in s
      if i == "("
        open++
      if i == ")"
        if open > 0
          open--
        else
          return false
    if open == 0
      return true
    else
      return false
