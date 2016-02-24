
describe 'Util', ->
  describe 'validateParentheses', ->
    it 'should validate correct parentheses', ->
      expect(util.validateParentheses('((()((()()))()))()')).to.equal(true)
      expect(util.validateParentheses('content(content(()(content(()()))(content)))()')).to.equal(true)
      expect(util.validateParentheses('')).to.equal(true)
    it 'should reject wrong parentheses', ->
      expect(util.validateParentheses('((()((()()))()))(')).to.equal(false)
      expect(util.validateParentheses('((()(()()))()))()')).to.equal(false)
      expect(util.validateParentheses('((()((()()))())()')).to.equal(false)
      expect(util.validateParentheses('content((()(((content)()))()))content(')).to.equal(false)
  describe 'checkFormat', ->
    it 'should detect strings correctly', ->
      expect(util.checkFormat("Hahaha",'string')).to.equal(true)
      expect(util.checkFormat("Hahaha",'number')).to.equal(false)
      expect(util.checkFormat(5,'string')).to.equal(false)
    it 'should detect numbers correctly', ->
      expect(util.checkFormat(2,'number')).to.equal(true)
      expect(util.checkFormat(2.6242,'number')).to.equal(true)
      expect(util.checkFormat("2.6242",'number')).to.equal(false)
    it 'should detect undefined correctly', ->
      expect(util.checkFormat(undefined,'undefined')).to.equal(true)
      expect(util.checkFormat(undefined,'string')).to.equal(false)
    it 'should detect booleans correctly', ->
      expect(util.checkFormat(true,'boolean')).to.equal(true)
      expect(util.checkFormat(true,'string')).to.equal(false)
      expect(util.checkFormat("true",'boolean')).to.equal(false)
    it 'should detect objects correctly', ->
      expect(util.checkFormat(null,'object')).to.equal(true)
      expect(util.checkFormat(null,'string')).to.equal(false)
      expect(util.checkFormat({name:"Name"},'object')).to.equal(true)
      expect(util.checkFormat({name:"Name"},'string')).to.equal(false)
    it 'should detect arrays correctly', ->
      expect(util.checkFormat([],'array')).to.equal(true)
      expect(util.checkFormat([7,8,4],'array')).to.equal(true)
      expect(util.checkFormat([1],'string')).to.equal(false)
      expect(util.checkFormat("[1]",'array')).to.equal(false)
    it 'should detect arraysOrStrings correctly', ->
      expect(util.checkFormat([7,8,4],'arrayOrString')).to.equal(true)
      expect(util.checkFormat("Hahaha",'arrayOrString')).to.equal(true)
      expect(util.checkFormat(5,'arrayOrString')).to.equal(false)
