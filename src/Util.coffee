
### UTILITY SCRIPTS ###

class Util
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  # Check if a value is even or not
  @isEven: (n) ->
    n % 2 is 0

  # Check if a value is odd or not
  @isOdd: (n) ->
    Math.abs(n % 2) is 1

  # Remove HTML tags from a string - used to clean input
  @stripHTML: (text) ->
    regex = /(<([^>]+)>)/ig
    text.replace regex, ''

  # Check if a variable is the chosen format
  @checkFormat: (s, format) ->
    if format is 'array'
      if Object::toString.call(s) is '[object Array]'
        return true
      else
        console.error "ERROR: Invalid input format (should be " + format + ")"
        return false
    else if format is 'arrayOrString'
      if Object::toString.call(s) is '[object Array]' || typeof s is 'string'
        return true
      else
        console.error "ERROR: Invalid input format (should be " + format + ")"
        return false
    else
      if typeof s is format
        return true
      else
        console.error "ERROR: Invalid input format (should be " + format + ")"
        return false

  # Check if the string has valid parentheses
  @validateParentheses: (s) ->
    open = 0
    for i in s
      if i is "("
        open++
      if i is ")"
        if open > 0
          open--
        else
          return false
    if open is 0
      return true
    else
      return false

  # Check if [] parentheses are valid - ignore /[ and /]
  @validateTagParentheses: (s) ->
    open = 0
    index = 0
    for i in s
      if i is "["
        if s[index-1]
          if s[index-1] isnt "/"
            open++
        else
          open++
      if i is "]"
        if s[index-1]
          if s[index-1] isnt "/"
            if open > 0
              open--
            else
              return false
        else
          if open > 0
            open--
          else
            return false
      index++
    if open is 0
      return true
    else
      return false

  # Merge two object arrays into one
  @mergeObjArrays = (list1, list2) ->
    result = {}
    list1.concat(list2).forEach (item) ->
      name = item.name
      row = result[name]
      if !row
        result[name] = item
        return
      for column of item
        row[column] = item[column]
      return
    finalResult = Object.keys(result).map((name) ->
      result[name]
    )
    return finalResult
