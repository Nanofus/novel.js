
### HANDLES LANGUAGE SETTINGS ###

class LanguageManager

  # Create instance
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  # Change the novel's language
  @setLanguage = (name) ->
    novelData.novel.settings.language = i

  # Get a string shown in UI in the current language
  @getUIString = (name) ->
    for i in novelData.novel.uiText
      if i.name is name and i.language is novelData.novel.settings.language
        return Parser.parseText(i.content)
    console.error 'Error! UI string ' + name + ' not found!'
    return '[NOT FOUND]'

  # Get the string in the correct language
  @getCorrectLanguageString = (obj) ->
    Util.checkFormat(obj,'arrayOrString')
    if typeof obj is "string"
      return obj
    if Object::toString.call(obj) is '[object Array]'
      for i in obj
        if i.language is novelData.novel.settings.language
          return i.content
