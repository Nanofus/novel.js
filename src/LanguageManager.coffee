
### HANDLES LANGUAGE SETTINGS ###

class LanguageManager

  # Create instance
  instance = null
  constructor: ->
    if instance
      return instance
    else
      instance = this

  @getUIString = (name) ->
    for i in novelData.novel.uiText
      if i.name is name and i.language is novelData.novel.settings.language
        return Parser.parseText(i.content)
    console.error 'Error! UI string ' + name + ' not found!'
    return '[NOT FOUND]'
