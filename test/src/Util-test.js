
describe('Util', function() {
  describe('validateParentheses', function() {
    it('should validate correct parentheses', function() {
      expect(Util.validateParentheses('((()((()()))()))()')).to.equal(true);
      expect(Util.validateParentheses('content(content(()(content(()()))(content)))()')).to.equal(true);
      return expect(Util.validateParentheses('')).to.equal(true);
    }
    );
    return it('should reject wrong parentheses', function() {
      expect(Util.validateParentheses('((()((()()))()))(')).to.equal(false);
      expect(Util.validateParentheses('((()(()()))()))()')).to.equal(false);
      expect(Util.validateParentheses('((()((()()))())()')).to.equal(false);
      return expect(Util.validateParentheses('content((()(((content)()))()))content(')).to.equal(false);
    }
    );
  }
  );
  return describe('checkFormat', function() {
    it('should detect strings correctly', function() {
      expect(Util.checkFormat("Hahaha",'string',true)).to.equal(true);
      expect(Util.checkFormat("Hahaha",'number',true)).to.equal(false);
      return expect(Util.checkFormat(5,'string',true)).to.equal(false);
    }
    );
    it('should detect numbers correctly', function() {
      expect(Util.checkFormat(2,'number',true)).to.equal(true);
      expect(Util.checkFormat(2.6242,'number',true)).to.equal(true);
      return expect(Util.checkFormat("2.6242",'number',true)).to.equal(false);
    }
    );
    it('should detect undefined correctly', function() {
      expect(Util.checkFormat(undefined,'undefined',true)).to.equal(true);
      return expect(Util.checkFormat(undefined,'string',true)).to.equal(false);
    }
    );
    it('should detect booleans correctly', function() {
      expect(Util.checkFormat(true,'boolean',true)).to.equal(true);
      expect(Util.checkFormat(true,'string',true)).to.equal(false);
      return expect(Util.checkFormat("true",'boolean',true)).to.equal(false);
    }
    );
    it('should detect objects correctly', function() {
      expect(Util.checkFormat(null,'object',true)).to.equal(true);
      expect(Util.checkFormat(null,'string',true)).to.equal(false);
      expect(Util.checkFormat({name:"Name"},'object',true)).to.equal(true);
      return expect(Util.checkFormat({name:"Name"},'string',true)).to.equal(false);
    }
    );
    it('should detect arrays correctly', function() {
      expect(Util.checkFormat([],'array',true)).to.equal(true);
      expect(Util.checkFormat([7,8,4],'array',true)).to.equal(true);
      expect(Util.checkFormat([1],'string',true)).to.equal(false);
      return expect(Util.checkFormat("[1]",'array',true)).to.equal(false);
    }
    );
    return it('should detect arraysOrStrings correctly', function() {
      expect(Util.checkFormat([7,8,4],'arrayOrString',true)).to.equal(true);
      expect(Util.checkFormat("Hahaha",'arrayOrString',true)).to.equal(true);
      return expect(Util.checkFormat(5,'arrayOrString',true)).to.equal(false);
    }
    );
  }
  );
}
);
