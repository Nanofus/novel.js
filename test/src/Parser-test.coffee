
describe 'Parser', ->
  describe 'parseItemsOrStats', ->
    it 'should return correct items with one item', ->
      items = parser.parseItemsOrStats("sword,1")
      expect(items[0][0]).to.equal('sword')
      expect(items[0][1]).to.equal('1')
    it 'should return correct items with multiple items', ->
      items = parser.parseItemsOrStats("sword,1|shield,2")
      expect(items[0][0]).to.equal('sword')
      expect(items[1][1]).to.equal('2')
      expect(items[2]).to.equal(undefined)
    it 'should return correct items when list empty', ->
      items = parser.parseItemsOrStats("")
      expect(items).to.equal(undefined)
  describe 'parseStatement', ->
    it 'should make correct calculations', ->
      expect(parser.parseStatement("20/4-(5+2)*2")).to.equal(-9)
    it 'should use items correctly', ->
      data.game.inventory = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("sword,4"),"add",true)
      expect(parser.parseStatement("20*inv.sword")).to.equal(80)
    it 'should use stats correctly', ->
      data.game.stats = []
      inventoryManager.editItemsOrStats(parser.parseItemsOrStats("villagesSaved,4|truthValue,true"),"add",false)
      expect(parser.parseStatement("(20*stat.villagesSaved==80)==stat.truthValue")).to.equal(true)
