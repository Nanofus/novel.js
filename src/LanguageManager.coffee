
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
    novelData.novel.settings.language = name
    UI.updateUILanguage()

  # Get a string shown in UI in the current language
  @getUIString = (name) ->
    Util.checkFormat(name,'string')
    for i in novelData.novel.uiText
      if i.name is name and i.language is novelData.novel.settings.language
        return Parser.parseText(i.content)
    console.error 'Error! UI string ' + name + ' not found!'
    return '[NOT FOUND]'

  # Get the correct version of csv string
  @getCorrectLanguageCsvString = (name) ->
    Util.checkFormat(name,'string')
    if novelData.csvData is undefined or novelData.csvEnabled is false
      console.error "Error! CSV data cannot be parsed, because Papa Parse can't be detected."
      return '[NOT FOUND]'
    for i in novelData.csvData
      if i.name is name
        if i[novelData.novel.settings.language] is undefined
          if i['english'] is undefined
            console.error 'Error! No CSV value by name ' + name + ' could be found.'
            return '[NOT FOUND]'
          return Parser.parseText(i['english'])
        return Parser.parseText(i[novelData.novel.settings.language])

  # Get an item's attribute in the correct language
  @getItemAttribute = (item, type) ->
    switch type
      when 'displayName'
        if item.displayName is '[csv]'
          return @getCorrectLanguageCsvString(item.name + '|displayName')
        else
          return @getCorrectLanguageString(item.displayName)
        break
      when 'description'
        if item.description is '[csv]'
          return @getCorrectLanguageCsvString(item.name + '|description')
        else
          return @getCorrectLanguageString(item.description)
        break
      else
        console.error 'Error! Trying to get an invalid item attribute in LanguageManager.'
        return '[NOT FOUND]'
        break

  # Get the string in the correct language
  @getCorrectLanguageString = (obj, type) ->
    Util.checkFormat(obj,'arrayOrString')
    if typeof obj is "string"
      return obj
    if Object::toString.call(obj) is '[object Array]'
      for i in obj
        if i.language is novelData.novel.settings.language
          return i.content
