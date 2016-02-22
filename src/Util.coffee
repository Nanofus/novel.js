
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
