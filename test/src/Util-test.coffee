
describe 'Util', ->
  describe 'validateParentheses', ->
    it 'should validate correct parentheses', ->
      expect(Util.validateParentheses('((()((()()))()))()')).to.equal(true)
      expect(Util.validateParentheses('content(content(()(content(()()))(content)))()')).to.equal(true)
      expect(Util.validateParentheses('')).to.equal(true)
    it 'should reject wrong parentheses', ->
      expect(Util.validateParentheses('((()((()()))()))(')).to.equal(false)
      expect(Util.validateParentheses('((()(()()))()))()')).to.equal(false)
      expect(Util.validateParentheses('((()((()()))())()')).to.equal(false)
      expect(Util.validateParentheses('content((()(((content)()))()))content(')).to.equal(false)
  describe 'checkFormat', ->
    it 'should detect strings correctly', ->
      expect(Util.checkFormat("Hahaha",'string')).to.equal(true)
      expect(Util.checkFormat("Hahaha",'number')).to.equal(false)
      expect(Util.checkFormat(5,'string')).to.equal(false)
    it 'should detect numbers correctly', ->
      expect(Util.checkFormat(2,'number')).to.equal(true)
      expect(Util.checkFormat(2.6242,'number')).to.equal(true)
      expect(Util.checkFormat("2.6242",'number')).to.equal(false)
    it 'should detect undefined correctly', ->
      expect(Util.checkFormat(undefined,'undefined')).to.equal(true)
      expect(Util.checkFormat(undefined,'string')).to.equal(false)
    it 'should detect booleans correctly', ->
      expect(Util.checkFormat(true,'boolean')).to.equal(true)
      expect(Util.checkFormat(true,'string')).to.equal(false)
      expect(Util.checkFormat("true",'boolean')).to.equal(false)
    it 'should detect objects correctly', ->
      expect(Util.checkFormat(null,'object')).to.equal(true)
      expect(Util.checkFormat(null,'string')).to.equal(false)
      expect(Util.checkFormat({name:"Name"},'object')).to.equal(true)
      expect(Util.checkFormat({name:"Name"},'string')).to.equal(false)
    it 'should detect arrays correctly', ->
      expect(Util.checkFormat([],'array')).to.equal(true)
      expect(Util.checkFormat([7,8,4],'array')).to.equal(true)
      expect(Util.checkFormat([1],'string')).to.equal(false)
      expect(Util.checkFormat("[1]",'array')).to.equal(false)
    it 'should detect arraysOrStrings correctly', ->
      expect(Util.checkFormat([7,8,4],'arrayOrString')).to.equal(true)
      expect(Util.checkFormat("Hahaha",'arrayOrString')).to.equal(true)
      expect(Util.checkFormat(5,'arrayOrString')).to.equal(false)
